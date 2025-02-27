import { useState, useMemo } from "react";
import Link from "next/link";
import { stateIdToStateNameMapping } from "@/data/statesMap";

export default function States() {
  const [search, setSearch] = useState("");
  
  // Memoized state processing
  const sortedStates = useMemo(() => {
    return Object.entries(stateIdToStateNameMapping)
      .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB))
      .filter(([, stateName]) => 
        stateName.toLowerCase().includes(search.toLowerCase())
      );
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation and Header */}
        <header className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <Link href="/" className="text-green-600 hover:underline flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Back to Home
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-800 mb-4">
              Explore Agricultural Insights by State
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover agricultural data, crop varieties, and market trends 
              specific to each state in India. Select a state to dive deep 
              into its agricultural landscape.
            </p>
          </div>
        </header>

        {/* Search Section */}
        <div className="mb-8 max-w-xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search states..."
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 text-gray-900 transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        </div>

        {/* State Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedStates.length > 0 ? (
            sortedStates.map(([stateId, stateName]) => (
              <Link
                key={stateId}
                href={`/states/${stateId}`}
                className="group"
              >
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all 
                  transform hover:-translate-y-2 flex items-center justify-center 
                  text-center text-gray-800 font-semibold 
                  border border-transparent hover:border-green-500 
                  group-hover:bg-green-50"
                >
                  {stateName}
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-2xl text-gray-500 mb-4">
                No states match your search
              </p>
              <p className="text-gray-400">
                Try a different search term or view all states
              </p>
            </div>
          )}
        </div>

        {/* Additional Information Section */}
        <section className="mt-12 bg-white shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">
            Why Explore State-wise Agricultural Data?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-green-700">
                Regional Insights
              </h3>
              <p className="text-gray-600">
                Understand unique agricultural characteristics 
                of different states in India.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-green-700">
                Market Opportunities
              </h3>
              <p className="text-gray-600">
                Explore crop varieties, trading potential, 
                and agricultural market trends.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.768-.231-1.49-.637-2.1M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.768.231-1.49.637-2.1M14 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-green-700">
                Community Connections
              </h3>
              <p className="text-gray-600">
                Connect with farmers and traders across 
                different agricultural regions.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}