"use client";

import { useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { stateIdToTopoIdMapping } from "@/data/statesMap"; // Import the mapping for TopoJSON
import { FeatureCollection } from "geojson"; // GeoJSON types

interface StateMapProps {
  stateId: string; // Simplified state ID (e.g., "ap")
  topoUrl: string; // Path to the TopoJSON file
}

export default function StateMap({ stateId, topoUrl }: StateMapProps) {
  const [mapData, setMapData] = useState<FeatureCollection | null>(null);

  // Get the TopoJSON ID for the given state
  const fullStateId = stateIdToTopoIdMapping[stateId];

  useEffect(() => {
    fetch(topoUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load TopoJSON: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => setMapData(data))
      .catch((err) => console.error("Error loading TopoJSON:", err));
  }, [topoUrl]);

  if (!mapData) {
    return <p>Loading map...</p>;
  }

  return (
    <div className="w-full h-96 border">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 900,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          center={[78.9629, 22.5937]} // Center of India [longitude, latitude]
          zoom={1}
          minZoom={1}
          maxZoom={8}
        >
          <Geographies geography={mapData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoId = geo.properties.id; // TopoJSON ID
                const isSelected = geoId === fullStateId; // Check if the current state is selected

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: isSelected ? "#FF0000" : "#E0E0E0",
                        outline: "none",
                      },
                      hover: {
                        fill: isSelected ? "#FF4F4F" : "#CCC",
                        outline: "none",
                      },
                      pressed: {
                        fill: "#CCC",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
