import { useState } from "react";
import Link from "next/link";
import { stateIdToStateNameMapping } from "@/data/statesMap"; // Import state mapping

export default function States() {
  const [search, setSearch] = useState("");
  
  const sortedStates = Object.entries(stateIdToStateNameMapping)
  .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB))
  .filter(([, stateName]) => stateName.toLowerCase().includes(search.toLowerCase())); // Filter logic
  
  return (
    <main className="p-6 max-w-6xl mx-auto">
    <h2 className="text-3xl font-bold text-center mb-6">Select a State</h2>
    
    {/* Search Box */}
    <div className="mb-6">
    <input
    type="text"
    placeholder="Search state..."
    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    />
    </div>
    
    {/* State Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {sortedStates.length > 0 ? (
      sortedStates.map(([stateId, stateName]) => (
        <Link
        key={stateId}
        href={`/states/${stateId}`}
        className="flex items-center justify-center p-4 bg-gray-950 text-white rounded-lg shadow-md hover:bg-gray-700 transition transform hover:scale-105"
        >
        {stateName}
        </Link>
      ))
    ) : (
      <p className="text-center text-gray-400 col-span-full">
      No states found.
      </p>
    )}
    </div>
    <div className="flex justify-center mt-4">
    <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
    ⬅ Back to Home
    </Link>
    </div>
    </main>
  );
}
