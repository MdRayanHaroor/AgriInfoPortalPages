import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import StateMap from "@/components/StateMap";
import { stateIdToStateNameMapping } from "@/data/statesMap";

interface RecordData {
  crop: string;
  season: string;
  crop_year: number;
  district_name: string;
  state_name: string;
  area: string;
  production_ : string, // Use string because API might return "NA"
}

interface UserInputData {
  name: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  village: string;
  fruitVegetable: string;
  variety: string;
  area: number;
  sownMonth: string;
  harvestingMonth: string;
}

export default function StateDetailPage() {
  const router = useRouter();
  const [stateData, setStateData] = useState<RecordData[]>([]);
  const [userInputs, setUserInputs] = useState<UserInputData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // Sorting state

  useEffect(() => {
    const fetchStateData = async () => {
      const rawStateId = router.query.stateId;
      const stateId = Array.isArray(rawStateId) ? rawStateId[0] : rawStateId;

      if (!stateId) {
        setError("Invalid state ID");
        setLoading(false);
        return;
      }

      const stateName = stateIdToStateNameMapping[stateId]; // For API queries
      if (!stateName) {
        setError("Invalid state ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Correct API URL with limit parameter
        const apiKey = "579b464db66ec23bdd00000198902acca33045767c8a79dfc3f0ce11";
        const apiUrl = `https://api.data.gov.in/resource/35be999b-0208-4354-b557-f6ca9a5355de?api-key=${apiKey}&format=json&filters[state_name]=${encodeURIComponent(
          stateName
        )}&limit=50`;

        console.log("Fetching API URL:", apiUrl);

        const apiResponse = await fetch(apiUrl);
        if (!apiResponse.ok) {
          throw new Error(`Failed to fetch API data: ${apiResponse.status}`);
        }
        const apiData = await apiResponse.json();
        console.log("API Data Records:", apiData.records);

        // Process and sort records by crop_year (descending)
        const apiRecords = apiData.records
  .map((record: Record<string, string | number | null>) => ({
    crop: record["crop"] as string,
    season: record["season"] as string,
    crop_year: record["crop_year"] as number,
    district_name: record["district_name"] as string,
    state_name: (record["state_name"] as string) || "N/A", // Fallback for missing state_name
    area: (record["area_"] as string) || "NA",
    production_: (record["production_"] as string) || "NA", // Add production field
  }))
  .sort((a: { crop_year: number; }, b: { crop_year: number; }) => b.crop_year - a.crop_year);

        setStateData(apiRecords);

        // Fetch user inputs from MongoDB Atlas
        const userInputsResponse = await fetch(`/api/get-user-inputs?state=${encodeURIComponent(stateName)}`);
        if (!userInputsResponse.ok) {
          throw new Error(`Failed to fetch user inputs: ${userInputsResponse.status}`);
        }
        const userInputsData = await userInputsResponse.json();
        setUserInputs(userInputsData);
      } catch (err) {
        if (err instanceof Error) {
          console.error("Fetch Error:", err.message);
          setError(err.message);
        } else {
          console.error("Unknown error occurred:", err);
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStateData();
  }, [router.query.stateId]);

  const handleSort = () => {
    const sortedData = [...stateData].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.crop_year - b.crop_year;
      } else {
        return b.crop_year - a.crop_year;
      }
    });
    setStateData(sortedData);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  if (loading) return <p>Loading data...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <section className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        State: {router.query.stateId?.toString().toUpperCase()}
      </h1>
      <div className="mb-6">
        <StateMap
          stateId={router.query.stateId?.toString() || ""}
          topoUrl="/india-states-topo.json"
        />
      </div>

      <h2 className="text-xl font-bold mt-8">User Inputs</h2>
      <div className="overflow-x-auto">
        {userInputs.length ? (
          <table className="table-auto w-full border border-gray-200 mt-4 text-sm">
            <thead>
              <tr className="text-black bg-gray-100">
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Phone</th>
                <th className="px-4 py-2 border">District</th>
                <th className="px-4 py-2 border">Village</th>
                <th className="px-4 py-2 border">Fruit/Vegetable</th>
                <th className="px-4 py-2 border">Variety</th>
                <th className="px-4 py-2 border">Area (Acres)</th>
                <th className="px-4 py-2 border">Sown Month</th>
                <th className="px-4 py-2 border">Harvesting Month</th>
              </tr>
            </thead>
            <tbody>
              {userInputs.map((input: UserInputData, index: number) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{input.name}</td>
                  <td className="px-4 py-2 border">{input.email}</td>
                  <td className="px-4 py-2 border">{input.phone}</td>
                  <td className="px-4 py-2 border">{input.district}</td>
                  <td className="px-4 py-2 border">{input.village}</td>
                  <td className="px-4 py-2 border">{input.fruitVegetable}</td>
                  <td className="px-4 py-2 border">{input.variety}</td>
                  <td className="px-4 py-2 border">{input.area}</td>
                  <td className="px-4 py-2 border">{input.sownMonth}</td>
                  <td className="px-4 py-2 border">{input.harvestingMonth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No user inputs available for the selected state.</p>
        )}
      </div>

      <h2 className="text-xl font-bold mt-8">State Agriculture Data (data.gov.in)</h2>
      <div className="overflow-x-auto">
        {stateData.length ? (
          <table className="table-auto w-full border border-gray-200 mt-4 text-sm">
            <thead>
              <tr className="text-black bg-gray-100">
                <th className="px-4 py-2 border">Crop</th>
                <th className="px-4 py-2 border">Season</th>
                <th className="px-4 py-2 border">
                  Year
                  <button
                    onClick={handleSort}
                    className="ml-2 text-blue-500 underline"
                  >
                    Sort
                  </button>
                </th>
                <th className="px-4 py-2 border">District</th>
                <th className="px-4 py-2 border">State</th>
                <th className="px-4 py-2 border">Area (acres)</th>
                <th className="px-4 py-2 border">Production (tonnes)</th>
              </tr>
            </thead>
            <tbody>
              {stateData.map((record: RecordData, index: number) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{record.crop}</td>
                  <td className="px-4 py-2 border">{record.season}</td>
                  <td className="px-4 py-2 border">{record.crop_year}</td>
                  <td className="px-4 py-2 border">{record.district_name}</td>
                  <td className="px-4 py-2 border">{record.state_name}</td>
                  <td className="px-4 py-2 border">{record.area}</td>
                  <td className="px-4 py-2 border">{record.production_}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No data available for the selected state.</p>
        )}
      </div>
    </section>
  );
}
