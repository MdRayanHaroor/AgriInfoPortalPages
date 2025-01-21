import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps"

export default function Home() {
  const [mapData, setMapData] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false) // State for hamburger menu

  useEffect(() => {
    console.log("Fetching map data from /india-states-topo.json")
    fetch("/india-states-topo.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch map data: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        console.log("Map data loaded successfully:", data)
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
                      <Geography
                        key={geo.rsmKey}
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

      {/* <footer className="bg-black text-white p-4 mt-12">
        <div className="container mx-auto text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} AgriInfo Portal. All rights reserved.
          </p>
        </div>
      </footer> */}
    </>
  )
}
