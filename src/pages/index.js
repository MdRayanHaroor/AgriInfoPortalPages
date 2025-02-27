import { useEffect, useState, useContext } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useRouter } from "next/router";
import { AuthContext } from "@/context/AuthContext";
import Link from "next/link";

export default function Home() {
  const [mapData, setMapData] = useState(null);
  const [topCrops, setTopCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const router = useRouter();
  const { user } = useContext(AuthContext) || {};

  useEffect(() => {
    // Fetch map data
    fetch("/india-states-topo.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch map data: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setMapData(data);
      })
      .catch((err) => console.error("Error loading map data:", err));

    // Fetch top crops
    const fetchTopCrops = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_AGRICULTURE_API_KEY;
        const apiUrl = `https://api.data.gov.in/resource/35be999b-0208-4354-b557-f6ca9a5355de?api-key=${apiKey}&format=json&limit=10`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch crop data");
        
        const data = await response.json();
        
        // Optimized unique crop extraction
        const cropSet = new Set();
        data.records.forEach((record) => cropSet.add(record.crop));
        const uniqueCrops = Array.from(cropSet).sort((a, b) => a.localeCompare(b)).slice(0, 8);
        
        setTopCrops(uniqueCrops);
      } catch (error) {
        console.error("Error fetching top crops:", error);
        // Fallback crops if API fails
        setTopCrops([
          "Rice", "Wheat", "Maize", "Sugarcane", 
          "Cotton", "Pulses", "Groundnut", "Soybean"
        ]);
      } finally {
        setLoadingCrops(false);
      }
    };

    fetchTopCrops();
  }, []);

  const handleStateClick = (geo) => {
    const stateId = geo.properties.id;
    const simplifiedStateId = stateId.slice(2).toLowerCase();
    router.push(`/states/${simplifiedStateId}`);
  };

  return (
    <main className="p-6 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 text-green-600">
          Agri Info Portal: Connecting Farmers and Markets
        </h1>
        <p className="text-xl mb-6 max-w-2xl mx-auto dark:text-white">
          Your comprehensive platform for agricultural insights, 
          crop management, and market opportunities across India
        </p>
      </section>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <Link href="/bids" className="w-full md:w-auto">
          <button className="bg-green-600 text-white px-6 py-3 rounded shadow-md hover:bg-green-700 transition flex items-center gap-2 w-full justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ongoing Bids
          </button>
        </Link>
        
        <Link href="/user-input" className="w-full md:w-auto">
          <button className="bg-blue-600 text-white px-6 py-3 rounded shadow-md hover:bg-blue-700 transition flex items-center gap-2 w-full justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Add Crop
          </button>
        </Link>
        
        <Link href="/my-crops" className="w-full md:w-auto">
          <button className="bg-purple-600 text-white px-6 py-3 rounded shadow-md hover:bg-purple-700 transition flex items-center gap-2 w-full justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            My Crops
          </button>
        </Link>
      </div>

      {/* Map Section with Description */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-6">
          Explore Agriculture Data Across India
        </h2>
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div className="">
            <p className="mb-4">
              Our interactive map allows you to explore agricultural data 
              from different states across India. Click on a state to 
              dive deep into its agricultural landscape, crop varieties, 
              and market insights.
            </p>
            <p className="mb-4">
              Discover local crop patterns, ongoing bids, and regional 
              agricultural trends that can help farmers and traders 
              make informed decisions.
            </p>
            <Link href="/states" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              View All States
            </Link>
          </div>

          {mapData ? (
            <div className="w-full h-[50vh] min-h-[300px] border bg-gradient-to-b from-gray-900 to-black rounded-md shadow-lg">
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 1000 }}
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup center={[76.9629, 22.5937]} zoom={1}>
                  <Geographies geography={mapData}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <g key={geo.rsmKey}>
                          <Geography
                            geography={geo}
                            onClick={() => handleStateClick(geo)}
                            style={{
                              default: {
                                fill: "#E0E0E0",
                                outline: "none",
                                cursor: "pointer",
                                stroke: "#000000",
                                strokeWidth: 0.5,
                              },
                              hover: {
                                fill: "#CCCCCC",
                                outline: "none",
                                stroke: "#000000",
                                strokeWidth: 0.5,
                              },
                              pressed: {
                                fill: "#AAAAAA",
                                outline: "none",
                              },
                            }}
                          />
                        </g>
                      ))
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-10 w-10 border-t-2 border-white rounded-full"></div>
            </div>
          )}
        </div>
      </section>

      {/* Top Crops Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-6">
          Explore Popular Crops
        </h2>
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div className="">
            <p className="mb-4">
              Discover the diverse range of crops cultivated across India. 
              Our platform provides comprehensive insights into various 
              agricultural products, helping farmers and traders make 
              informed decisions.
            </p>
            <p className="mb-4">
              From staple grains to cash crops, explore the agricultural 
              diversity that drives India&apos;s farming ecosystem.
            </p>
            <Link href="/crops" className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
              View All Crops
            </Link>
          </div>

          {loadingCrops ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-10 w-10 border-t-2 border-green-500 rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {topCrops.map((crop, index) => (
                <Link 
                  key={index} 
                  href={`/crops/${encodeURIComponent(crop)}`}
                  className="p-4 bg-green-100 text-green-800 rounded shadow hover:bg-green-200 transition text-center"
                >
                  {crop}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Key Features Section */}
      <section className="bg-gray-100 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-8 dark:text-black">
          Key Features of Agri Info Portal
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-green-600">
              Crop Tracking
            </h3>
            <p className="text-gray-600">
              Easily track and manage your crop information, 
              from sowing to harvesting.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-blue-600">
              Bidding Platform
            </h3>
            <p className="text-gray-600">
              Connect with traders and get the best prices 
              for your agricultural produce.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-purple-600">
              State-wise Insights
            </h3>
            <p className="text-gray-600">
              Explore detailed agricultural data and trends 
              from different states across India.
            </p>
          </div>
        </div>
      </section>

      {/* Admin Section */}
      {user && user.role === "admin" && (
        <section className="mt-12 text-center">
          <Link href="/admin">
            <button className="bg-red-600 text-white px-6 py-3 rounded shadow-md hover:bg-red-700 transition">
              Admin Dashboard
            </button>
          </Link>
        </section>
      )}
    </main>
  );
}