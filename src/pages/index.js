import { useEffect, useState } from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Annotation,
} from "react-simple-maps"

export default function Home() {
  const [mapData, setMapData] = useState(null)

  useEffect(() => {
    fetch("/india-states-topo.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch map data: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        setMapData(data)
      })
      .catch((err) => console.error("Error loading map data:", err))
  }, [])

  return (
    <>
      <main className="p-6 max-w-6xl mx-auto">
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
                          style={{
                            default: {
                              fill: "#E0E0E0",
                              outline: "none",
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
  )
}
