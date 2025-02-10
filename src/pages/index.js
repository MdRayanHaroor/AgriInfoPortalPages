import { useEffect, useState, useContext } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useRouter } from "next/router";
import { AuthContext } from "@/context/AuthContext";
//import Link from "next/link";

export default function Home() {
  const [mapData, setMapData] = useState(null);
  const router = useRouter();
  const { user } = useContext(AuthContext) || {};

  useEffect(() => {
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
  }, []);

  const handleStateClick = (geo) => {
    const stateId = geo.properties.id; // e.g., "INAP", "INTN"
    const simplifiedStateId = stateId.slice(2).toLowerCase(); // e.g., "ap", "tn"
    router.push(`/states/${simplifiedStateId}`);
  };

  return (
    <>
      <main className="p-6 max-w-6xl mx-auto">
        {/* Main Navigation Buttons */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/my-crops")}
            className="bg-blue-600 text-white px-6 py-3 rounded shadow-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            My Crops
          </button>
          <button
            onClick={() => router.push("/states")}
            className="bg-blue-600 text-white px-6 py-3 rounded shadow-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            View All States
          </button>
          <button
            onClick={() => router.push("/crops")}
            className="bg-blue-600 text-white px-6 py-3 rounded shadow-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            View Crops
          </button>
          <button
            onClick={() => router.push("/user-input")}
            className="bg-green-600 text-white px-6 py-3 rounded shadow-md hover:bg-green-700 transition flex items-center gap-2"
          >
            Input Data
          </button>
          {user && user.role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="bg-red-600 text-white px-6 py-3 rounded shadow-md hover:bg-red-700 transition flex items-center gap-2"
            >
              Admin Dashboard
            </button>
          )}
        </div>

        <h2 className="text-3xl font-bold text-center mb-6">
          Explore Agriculture Data on the Map
        </h2>

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
      </main>
    </>
  );
}
