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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin h-16 w-16 border-t-4 border-green-500 rounded-full mx-auto mb-4"></div>
        <p className="text-xl text-gray-600">Loading agricultural bids...</p>
        <p className="text-sm text-gray-500 mt-2">
          Preparing market insights and crop opportunities
        </p>
      </div>
    </div>
  );
}

// Error Message Component
function ErrorMessage({ message }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Bid Retrieval Error</p>
          <p className="text-sm">{message}</p>
        </div>
        <p className="text-gray-600 mb-4">
          We couldn&apos;t fetch the ongoing bids at the moment. 
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

// BidCard component
function BidCard({ bid }) {
  const timeLeft = useBidTimer(bid.endTime);
  const { user } = useContext(AuthContext);
  const cropDetails = bid.cropDetails || {};
  
  // Safely access bids array
  const bidsArray = Array.isArray(bid.bids) ? bid.bids : [];
  const userBid = bidsArray.find(b => b.traderEmail === user?.email);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-green-800 flex items-center">
              {cropDetails.fruitVegetable || "Unspecified Crop"}
              {userBid && (
                <span className="ml-3 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Your Bid: ₹{userBid.bidPerAcre}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              📍 {cropDetails.district || "N/A"}, {cropDetails.village || "N/A"}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              {timeLeft}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4 border-t border-gray-200 pt-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Crop Area</span>
              <span className="font-semibold text-gray-700">{cropDetails.area || "N/A"} acres</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Minimum Bid</span>
              <span className="font-semibold text-green-700">
                ₹{bid.minimumBid}/acre
              </span>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Total Bids</span>
              <span className="font-semibold text-gray-700">{bidsArray.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Harvest Date</span>
              <span className="font-semibold text-gray-700">
                {new Date(bid.endTime).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href={`/bids/${bid._id}`}
            className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors flex items-center"
          >
            {userBid ? 'Manage Bid' : 'Place Bid'}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
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
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <header className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-green-800">Ongoing Bids</h1>
            <Link href="/" className="text-green-600 hover:underline flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Back to Home
            </Link>
          </div>
          <p className="text-gray-600 max-w-2xl">
            Explore current agricultural bidding opportunities. 
            View crop details, place bids, and connect with potential buyers 
            across various regions and crop types.
          </p>
        </header>
        
        {/* Bids Grid */}
        <div className="grid grid-cols-1 gap-6">
          {bids.length > 0 ? (
            bids.map((bid) => (
              <BidCard key={bid._id} bid={bid} />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                No Ongoing Bids
              </h2>
              <p className="text-gray-600 mb-6">
                There are currently no active bidding opportunities. 
                Check back later or explore available crops.
              </p>
              <Link 
                href="/crops" 
                className="bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition flex items-center justify-center max-w-xs mx-auto"
              >
                Explore Available Crops
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Additional Information Section */}
        <section className="mt-10 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            About Our Bidding Platform
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-green-700">
                Fair Market Access
              </h3>
              <p className="text-gray-600 text-sm">
                Connect directly with potential buyers and get competitive 
                pricing for your agricultural produce.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-green-700">
                Transparent Bidding
              </h3>
              <p className="text-gray-600 text-sm">
                Real-time bidding with clear rules and open communication 
                to ensure fair trade for farmers and traders.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-green-700">
                Market Insights
              </h3>
              <p className="text-gray-600 text-sm">
                Gain valuable insights into crop values, market trends, 
                and potential trading opportunities.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}