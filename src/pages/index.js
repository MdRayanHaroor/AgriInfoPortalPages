import { useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Annotation,
} from "react-simple-maps";
import { useRouter } from "next/router";

export default function Home() {
  const [mapData, setMapData] = useState(null);
  const router = useRouter();

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
    const stateId = geo.properties.id; // Assuming `id` corresponds to the state ID (e.g., "INAP", "INTN")
    const simplifiedStateId = stateId.slice(2).toLowerCase(); // Convert to simplified ID (e.g., "ap", "tn")
    router.push(`/states/${simplifiedStateId}`);
  };

  return (
    <>
      <main className="p-6 max-w-6xl mx-auto">
        {/* Main Buttons */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/states")}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
          >
            View All States
          </button>
          <button
            onClick={() => router.push("/user-input")}
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition"
          >
            Input Data
          </button>
        </div>

        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Explore Agriculture Data on the Map
        </h2>
        {mapData ? (
          <div className="w-full h-[600px] border bg-black">
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
                        {/* Render the state shapes */}
                        <Geography
                          geography={geo}
                          onClick={() => handleStateClick(geo)} // Navigate to the state page on click
                          style={{
                            default: {
                              fill: "#E0E0E0",
                              outline: "none",
                              cursor: "pointer",
                            },
                            hover: {
                              fill: "#CCCCCC",
                              outline: "none",
                            },
                            pressed: {
                              fill: "#AAAAAA",
                              outline: "none",
                            },
                          }}
                        />

                        {/* Render the state names */}
                        <Annotation
                          subject={geo.properties.centroid || [0, 0]} // Use centroids or calculate manually
                          dx={0}
                          dy={0}
                          connectorProps={{
                            stroke: "none",
                            strokeWidth: 1,
                            strokeLinecap: "round",
                          }}
                        >
                          <text
                            x="0"
                            y="0"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fontSize="10"
                            fill="#FFFFFF"
                            style={{ pointerEvents: "none" }}
                          >
                            {geo.properties.name}
                          </text>
                        </Annotation>
                      </g>
                    ))
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>
        ) : (
          <p>Loading map...</p>
        )}
      </main>
    </>
  );
}
