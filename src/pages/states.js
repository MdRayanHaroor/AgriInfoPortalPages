import Link from "next/link";
import { stateIdToStateNameMapping } from "@/data/statesMap"; // Import the state mapping

export default function States() {
  // Sort the state entries alphabetically by state name
  const sortedStates = Object.entries(stateIdToStateNameMapping).sort(([, nameA], [, nameB]) =>
    nameA.localeCompare(nameB)
  );

  return (
    <>
      <main className="p-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Select a State
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {sortedStates.map(([stateId, stateName]) => (
            <Link
              key={stateId}
              href={`/states/${stateId}`}
              className="p-4 bg-black text-white rounded shadow hover:bg-gray-800 transition"
            >
              {stateName}
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
